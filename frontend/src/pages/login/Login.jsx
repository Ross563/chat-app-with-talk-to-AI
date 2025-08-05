import { useState } from "react";
import { Link } from "react-router-dom";
import useLogin from "../../hooks/useLogin";
import { FaCopy } from "react-icons/fa";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [copyEmailSuccess, setCopyEmailSuccess] = useState(false);

  const { loading, login } = useLogin();

  const testEmail = "2222@2222.2222";

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(testEmail);
    setCopyEmailSuccess(true);
    setTimeout(() => setCopyEmailSuccess(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-w-96 mx-auto">
      <div className="w-full p-6 rounded-lg shadow-md bg-gray-400 bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-0">
        <h1 className="text-3xl font-semibold text-center text-gray-300">
          Login
          <span className="text-blue-500"> ChatApp</span>
        </h1>

        <form onSubmit={handleSubmit}>
          <div>
            <label className="label p-2">
              <span className="text-base label-text">Email</span>
            </label>
            <input
              type="email"
              placeholder="Enter email"
              className="w-full input input-bordered h-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="label">
              <span className="text-base label-text">Password</span>
            </label>
            <input
              type="password"
              placeholder="Enter Password"
              className="w-full input input-bordered h-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Link
            to="/signup"
            className="text-sm  hover:underline hover:text-blue-600 mt-2 inline-block"
          >
            {"Don't"} have an account?
          </Link>

          <div>
            <button className="btn btn-block btn-sm mt-2" disabled={loading}>
              {loading ? (
                <span className="loading loading-spinner "></span>
              ) : (
                "Login"
              )}
            </button>
          </div>
          <div className="mt-5 text-sm">
            <div className="flex items-center gap-2 mb-1">
              <span>Test email: {testEmail}</span>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="p-1 rounded bg-gray-700 transition-colors"
                title="Copy email"
              >
                <FaCopy
                  className={
                    copyEmailSuccess ? "text-green-500" : "text-gray-400"
                  }
                />
              </button>
              {copyEmailSuccess && (
                <span className="text-xs text-green-500 bg-gray-200 rounded-md p-1">
                  Copied!
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span>Test password {" = Test email"}</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
export default Login;
