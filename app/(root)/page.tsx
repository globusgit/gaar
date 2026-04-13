"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function SignIn() {
  const [form, setForm] = useState({
    username: "",
    password: "",
  });
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const signInData = {
      username: form.username,
      password: form.password,
    };
    //console.log("In handleSubmit function email: ", signInData.username);
    //console.log("password before submit: ", signInData.password);
    try {
      const res = await signIn("credentials", {
        username: signInData.username,
        password: signInData.password,
        redirect: false,
      });
      //console.log("SIGNIN RESPONSE:", res);
      if (res?.ok) {
        router.push("/dashboard");
      } else {
        alert("Either email or password do not match!");
      }
    } catch (err) {
      alert("Either email or password do not match!");
    }
  }

  return (
    <div className="flex justify-center align-middle p-35">
      <form onSubmit={(e) => handleSubmit(e)}>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Login to your account</CardTitle>
            <CardDescription>
              Enter your email below to login to your account
            </CardDescription>
            <CardAction>
              <Button variant="link">Sign Up</Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="m@example.com"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button type="submit" className="w-full">
              Login
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
