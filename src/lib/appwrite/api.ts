import { ID, Query } from "appwrite";
import { INewUser } from "../types";
import { account, appwriteConfig, avatars, databases } from "./config";


export async function createUserAccount(user: INewUser){
    try{
        const newAccount = await account.create(
            ID.unique(),
            user.email,
            user.password,
            user.name
        );

        if(!newAccount) throw Error;

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


    }catch(error){
        console.log(error)
        return error;
    }
}



export async function saveUserToDB(user:{
    accountId: string;
    name: string;
    email: string;
    imageUrl: URL;
    username?:string;           // optional
}){
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
export async function signInAccount(user:{
    email: string;
    password:string;
}){
    try {
        console.log('signing inn ');
        const session = await account.createEmailSession(user.email, user.password);
        console.log('session :' + session);

        // trying to store session in local storage since appwrite is giving 401 unauthorized from localhost (might delete later when hosted )
        // userId stored as a sessionId -> purpose of storing is after some time of user log in, when try to fetch useId on reload the appWrite is unable to fetch resulting 401 so we will provide it via localstorage
        // localStorage.setItem('sessionId', session.userId);
        return session;

    } catch (error) {
        console.log('during session creation '+error);
        
    }
}




export async function getCurrentUser() {

    try {
            console.log("userId: ", localStorage.getItem("sessionId"));
            const currentAccount  = await account.get();         // this will get the currently logged in user

            // const currentAccountId = localStorage.getItem('sessionId');
        
            // if currentAccount doesnt exist -> throw error else try to retrieve it 
            if(!currentAccount) throw Error;
            // if(currentAccountId !== null){

                const currentUser = await databases.listDocuments(
                    appwriteConfig.databaseId,
                    appwriteConfig.userCollectionId,
                    [Query.equal("accountId", currentAccount.$id)]
                    // [Query.equal('accountId', currentAccountId)]
                );

                if(!currentUser)
                    throw Error; 
            
                return currentUser.documents[0];
            // }
        
        } catch (error) {
            console.log('---- '+error);
            return null;
        }
    
}



//  appwrite also provide feature to delete the session 

export async function signOutAccount() {
    try{
        const session = await account.deleteSession('current');
        return session;
    }catch(error){
        console.log(error);
        
    }
}