"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LoginButton } from "@/features/auth/LoginButton";
import { usePendingFuelPlan } from "@/hooks/usePendingFuelPlan";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Register() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Handle auto-save of pending plan after signup
  usePendingFuelPlan();

  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof registerSchema>) => {
    try {
      const { name, email, password } = data;

      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await updateProfile(userCred.user, { displayName: name });

      toast({
        title: "account created 🎉",
        description: `welcome, ${name}! you're all set.`,
        variant: "default", // or 'success' if you define one
      });

      // Handle redirect after registration
      const returnTo = searchParams.get("returnTo");
      const savePlan = searchParams.get("savePlan");

      setTimeout(() => {
        if (returnTo && savePlan) {
          navigate(`${returnTo}?savePlan=true`);
        } else if (returnTo) {
          navigate(returnTo);
        } else {
          navigate("/");
        }
      }, 1500);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "registration failed",
        description: err.message || "something went wrong.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-[70vh] px-4">
      <h1 className="text-2xl font-bold mb-4">Create an Account</h1>
      <p className="text-gray-600 mb-6">
        Sign up to save your fuel plans and track your routes.
      </p>

      {/* Google Sign In Button */}
      <div className="w-full max-w-sm mb-6">
        <LoginButton />
      </div>

      {/* Divider */}
      <div className="relative w-full max-w-sm mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with email</span>
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full max-w-sm space-y-4"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full">
            Register
          </Button>
        </form>
      </Form>
    </div>
  );
}
