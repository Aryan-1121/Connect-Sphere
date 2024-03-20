import { Outlet, Navigate } from "react-router-dom"



// Holds home screen logo and right hand side image 


const AuthLayout = () => {

  const isAuthenticated =false 
  return (
    <>
      {/* if authenticated then navigate to home page  else be on the page it is */}
      {
      isAuthenticated ?
        (<Navigate to={"/"} />) :
        <> 
          <section className="flex flex-1 justify-center items-center flex-col py-10">
            <Outlet />
          </section>
          
          <img />
          
        </>




          }
        </>
  )
}

export default AuthLayout