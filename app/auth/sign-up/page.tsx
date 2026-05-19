import { Suspense } from "react";
import { SignUpForm } from "@/components/sign-up-form";

export default function Page() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f7f1e3] p-6">
      <Suspense fallback={null}>
        <SignUpForm />
      </Suspense>
    </div>
  );
}
