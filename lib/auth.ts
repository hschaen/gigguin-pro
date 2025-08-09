import GoogleProvider from "next-auth/providers/google"
import type { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only allow your specific email address
      const allowedEmail = "harrison@thehouseentertainment.com"
      
      if (user.email === allowedEmail) {
        return true
      }
      
      return false // Deny access to other emails
    },
    async session({ session, token }) {
      return session
    },
    async jwt({ token, user }) {
      return token
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  }
} 