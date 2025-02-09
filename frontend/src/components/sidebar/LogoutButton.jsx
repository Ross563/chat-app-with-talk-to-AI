import { BiLogOut } from "react-icons/bi";
import useLogout from "../../hooks/useLogout";

const LogoutButton = () => {
  const { loading, logout } = useLogout();

  return (
    <div className="mt-auto">
      {!loading ? (
        <button className="flex items-center gap-2" onClick={logout}>
          <BiLogOut className="w-6 h-6 text-white cursor-pointer" />
          <span className="text-white">Logout</span>
        </button>
      ) : (
        <span className="loading loading-spinner"></span>
      )}
    </div>
  );
};
export default LogoutButton;
