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
      <Accordion
        type="single"
        collapsible
        className="mt-6 w-full mx-auto md:max-w-lg lg:max-w-full"
      >
        <AccordionItem value="tips">
          <AccordionTrigger
            className="shadow-lg bg-white hover:bg-white hover:no-underline 
            focus:outline-none focus:ring-0 focus:border-none
            border-none border-transparent
            data-[state=open]:border-none data-[state=open]:border-transparent"
          >
            Running Tips
          </AccordionTrigger>
          <AccordionContent className="w-full max-w-full mx-auto">
            <div className="bg-blue-50">
              <div className="space-y-2 text-left pt-1 px-4">
                <div>
                  <h3 className="font-bold mt-4">What is my training pace?</h3>
                  <p>
                    Your training pace is the speed at which you run during
                    training sessions. It's typically your easy pace, which is a
                    comfortable, conversational pace.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold">What are Yasso 800s?</h3>
                  <p>
                    Yasso 800s are interval runs used to predict marathon times.
                    You run 800-meter intervals at a pace matching your target
                    marathon time, with 6-10 repetitions and recovery in
                    between. The intervals help estimate your marathon
                    performance.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold">What is a long run?</h3>
                  <p>
                    A long run builds endurance, typically ranging from 16-28 km
                    for marathon training and half that for half marathon
                    training, depending on your experience and goals.
                  </p>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </>
  );
};

export default RunningTips;
