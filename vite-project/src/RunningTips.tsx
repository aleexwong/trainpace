import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const RunningTips = () => {
  return (
    <>
      {/* Tips Accordion */}
      <Accordion type="single" collapsible className="mt-6">
        <AccordionItem value="tips">
          <AccordionTrigger
            className="bg-white hover:bg-white hover:no-underline 
            focus:outline-none focus:ring-0 focus:border-none
            border-none border-transparent
            data-[state=open]:border-none data-[state=open]:border-transparent"
          >
            Running Tips
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 text-left">
              <div>
                <h3 className="font-bold">What is my training pace?</h3>
                <p>
                  Your training pace is the speed at which you run during
                  training sessions. Different types of runs target different
                  aspects of fitness.
                </p>
              </div>
              <div>
                <h3 className="font-bold">What are Yasso 800s?</h3>
                <p>
                  Yasso 800s are specialized interval training runs used to
                  predict marathon times. They involve running 800-meter
                  intervals at a specific pace.
                </p>
              </div>
              <div>
                <h3 className="font-bold">What is a long run?</h3>
                <p>
                  A long run is a sustained effort longer than your typical
                  daily runs, designed to build endurance. The distance varies
                  based on your experience and goals.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </>
  );
};

export default RunningTips;
