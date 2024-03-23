import { ID, Query } from "appwrite";
import { INewPost, INewUser } from "../types";
import { account, appwriteConfig, avatars, databases, storage } from "./config";
import { toast } from "@/components/ui/use-toast";


export async function createUserAccount(user: INewUser) {
    try {
        const newAccount = await account.create(
            ID.unique(),
            user.email,
            user.password,
            user.name
        );

        if (!newAccount) throw Error;

        const avatarUrl = avatars.getInitials(user.name);


        // .$id -> thats how appwrite stores id 
        const newUser = await saveUserToDB({
            accountId: newAccount.$id,
            name: newAccount.name,
            email: newAccount.email,
            imageUrl: avatarUrl,
            username: user.username
        });

        return newUser;


    } catch (error) {
        console.log(error)
        return error;
    }
}



export async function saveUserToDB(user: {
    accountId: string;
    name: string;
    email: string;
    imageUrl: URL;
    username?: string;           // optional
}) {
    try {
        const newUser = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            user

        );
        return newUser;

    } catch (error) {
        console.log(error);

    }

}


// to create session using email and password
export async function signInAccount(user: {
    email: string;
    password: string;
}) {
    try {
        console.log('signing inn ');
        const session = await account.createEmailSession(user.email, user.password);
        console.log('session :' + session);

        // trying to store session in local storage since appwrite is giving 401 unauthorized from localhost (might delete later when hosted )
        // userId stored as a sessionId -> purpose of storing is after some time of user log in, when try to fetch useId on reload the appWrite is unable to fetch resulting 401 so we will provide it via localstorage
        // localStorage.setItem('sessionId', session.userId);
        return session;

    } catch (error) {
        console.log('during session creation ' + error);

    }
}




export async function getCurrentUser() {

    try {
        const currentAccount = await account.get();         // this will get the currently logged in user

        // const currentAccountId = localStorage.getItem('sessionId');

        // if currentAccount doesnt exist -> throw error else try to retrieve it 
        if (!currentAccount) throw Error;
        // if(currentAccountId !== null){

        const currentUser = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal("accountId", currentAccount.$id)]
            // [Query.equal('accountId', currentAccountId)]
        );

        if (!currentUser)
            throw Error;

        return currentUser.documents[0];
        // }

    } catch (error) {
        console.log('---- ' + error);
        return null;
    }

}



//  appwrite also provide feature to delete the session 

export async function signOutAccount() {
    try {
        const session = await account.deleteSession('current');
        return session;
    } catch (error) {
        console.log(error);

    }
}




export async function createPost(post: INewPost) {
    try {
        // Upload file to appwrite storage
        const uploadedFile = await uploadFile(post.file[0]);      // the first post

        if (!uploadedFile) throw Error;

        // if file uploaded succeffully Get file url
        const fileUrl = getFilePreview(uploadedFile.$id);
        if (!fileUrl) {
            // if file is somehow curroupted we need to delete it 
            await deleteFile(uploadedFile.$id);
            throw Error;
        }

        // Converting tags into array
        const tags = post.tags?.replace(/ /g, "").split(",") || [];

        // Create post (saving post to db )
        const newPost = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            ID.unique(),
            {
                creator: post.userId,
                caption: post.caption,
                imageUrl: fileUrl,
                imageId: uploadedFile.$id,
                location: post.location,
                tags: tags,
            }
        );

        if (!newPost) {
            await deleteFile(uploadedFile.$id);
            throw Error;
        }

        return newPost;
    } catch (error) {
        console.log(error);
    }
}




export async function uploadFile(file: File) {
    try {
        const uploadedFile = await storage.createFile(
            appwriteConfig.storageId,
            ID.unique(),
            file
        );

        return uploadedFile;
    } catch (error) {
        console.log(error);
    }
}




// GETTING FILE URL
export function getFilePreview(fileId: string) {
    try {
        const fileUrl = storage.getFilePreview(
            appwriteConfig.storageId,
            fileId,
            2000,
            2000,
            "top",
            100
        );

        if (!fileUrl) throw Error;

        return fileUrl;
    } catch (error) {
        console.log(error);
    }
}




//  DELETING  FILE
export async function deleteFile(fileId: string) {
    try {
        await storage.deleteFile(appwriteConfig.storageId, fileId);

        return { status: "ok" };
    } catch (error) {
        console.log(error);
    }
}



export async function getRecentPosts() {
    try {
        const posts = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            [Query.orderDesc("$createdAt"), Query.limit(20)]
        );

        if (!posts) throw Error;

        return posts;
    } catch (error) {
        console.log(error);
    }
}



// update like in db

export async function likePost(postId: string, likesArray: string[]) {
    try {
      const updatedPost = await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.postCollectionId,
        postId,
        {
          likes: likesArray,
        }
      );
  
      if (!updatedPost){
        toast({
            title:'Something went wrong couldnt like now :('
        })
        throw Error;
      } 
  
      return updatedPost;
    } catch (error) {
      console.log(error);
    }
  }




//   createing new record in saves  db (saving postId in saves database) 

  export async function savePost(userId: string, postId: string) {
    try {
      const updatedPost = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.savesCollectionId,
        ID.unique(),
        {
          user: userId,
          post: postId
        }
      );
  
      if (!updatedPost){
        toast({
            title:'Something went wrong couldnt save this post :('
        })
        throw Error;
      } 
    //   console.log(`userid= ${userId}, postId=${postId}`);
      
    //   console.log('save post / updatedpost / uniqueId of saves '+updatedPost.$id);
    //   console.log(updatedPost.$);
  
      return updatedPost;
    } catch (error) {
      console.log(error);
    }
  }





  export async function deleteSavedPost(savedRecordId: string) {
    try {
      const statusCode = await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.savesCollectionId,
        savedRecordId
      );
  
      if (!statusCode){
        toast({
            title:'Something went wrong couldnt delete this post :('
        })
        throw Error;
      } 
  
      return { status: 'ok'};
    } catch (error) {
      console.log(error);
    }
  }




