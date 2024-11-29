import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

export const CalculatorModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild className="bg-white">
        <Button
          variant="outline"
          size="icon"
          className="ml-2 text-blue-600 hover:bg-blue-50"
        >
          <Info className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-blue-50">
        <DialogHeader>
          <DialogTitle>How does the Pace Calculator Works 🏃</DialogTitle>
          <DialogDescription>
            A simple and intuitive way to calculate pace and speed based on your
            input
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <section>
            <h3 className="font-semibold mb-2">Enter Your Race Info 🥇</h3>
            <p className="text-sm text-gray-600">
              Input your recent race time (e.g., 25 minutes for a 5K) and the
              race distance in miles or kilometers. Select whether to calculate
              pace in minutes per kilometer or per mile.
            </p>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Calculate Your Base Pace 🏎️</h3>
            <p className="text-sm text-gray-600">
              The calculator determines your "base" pace, which is your average
              speed during the race. For example, if you ran a 10K in 50
              minutes, your base pace would be 5 minutes per kilometer.
            </p>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Adjust for Training Types 🏋️</h3>
            <p className="text-sm text-gray-600">
              Training runs vary based on their purpose. The calculator adjusts
              your base pace for these common training types:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600">
              <li>
                <strong>Easy Runs:</strong> Slower pace, focusing on recovery
                and endurance.
              </li>
              <li>
                <strong>Tempo Runs:</strong> Moderately hard pace to improve
                stamina.
              </li>
              <li>
                <strong>Maximum Effort:</strong> Race-intensity pace to simulate
                competition.
              </li>
              <li>
                <strong>Speed Work:</strong> Short bursts faster than race pace
                to boost speed.
              </li>
              <li>
                <strong>Extra Long Runs:</strong> Slower, sustained pace to
                build endurance for long races.
              </li>
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};
