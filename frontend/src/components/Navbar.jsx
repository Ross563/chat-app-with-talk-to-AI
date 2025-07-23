import { Link } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import LogoutButton from "./sidebar/LogoutButton";
import { RiLockPasswordLine } from "react-icons/ri";

const Navbar = () => {
  const { authUser } = useAuthContext();

  return (
    <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-3 px-6 shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <RiLockPasswordLine className="text-2xl text-blue-400" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            End-To-End Encrypted App
          </h1>
        </div>

        <div className="flex items-center space-x-6">
          {!authUser ? (
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <span>Login</span>
              </Link>
              <Link
                to="/signup"
                className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <span>Sign Up</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-gray-700 py-1 px-3 rounded-lg">
                <img
                  src={authUser.profilePic}
                  alt="profile"
                  className="w-8 h-8 rounded-full border-2 border-blue-400"
                />
                <span className="font-medium">{authUser.fullName}</span>
              </div>
              <LogoutButton />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
