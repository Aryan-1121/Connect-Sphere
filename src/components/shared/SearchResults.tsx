import { Models } from "appwrite";
import Loader from "./Loader";
import { searchPosts } from "@/lib/appwrite/api";
import GridPostList from "./GridPostList";




type SearchResultsProps ={
    isSearchFetching: boolean;
    searchedPosts: Models.Document[];
}


const SearchResults = ({isSearchFetching, searchedPosts}: SearchResultsProps) => {


    if(isSearchFetching)
        return <Loader />

    console.log("seachded post = "+ searchPosts);
    
    if(searchedPosts && searchedPosts.documents.length > 0){

        return(
            <GridPostList posts={searchPosts.documents} />
        ) 
        
    }


  return (
    <p className="text-light-4 mt-10 text-center w-full">No results found</p>
  )
}

export default SearchResults