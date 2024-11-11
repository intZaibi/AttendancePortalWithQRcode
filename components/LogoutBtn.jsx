"use client"
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    Cookies.remove('token');
    router.push('/auth/signIn');
  };

  return (
    <button onClick={handleLogout}>Logout</button>
  );
}
