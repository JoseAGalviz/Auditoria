import LoginForm from "../components/LoginForm";

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-10 transition-colors duration-500">
      <LoginForm />
    </div>
  );
};

export default LoginPage;
