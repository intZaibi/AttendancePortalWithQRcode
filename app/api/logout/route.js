export async function GET() {
  return new Response(JSON.stringify({ message: "Logged out successfully" }), {
    status: 200,
    headers: {
      'Set-Cookie': 'token=; HttpOnly; Path=/; Max-Age=0;', // Clear the cookie
    },
  });
}
