/**
 * VdotFaq — Accordion FAQ section using shadcn/ui Accordion
 */

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ_ITEMS = [
  {
    question: "What is VDOT in running?",
    answer:
      'VDOT is a performance-based fitness metric developed by exercise physiologist and coach Jack Daniels. It stands for "V-dot-O\u2082max" and represents the rate of oxygen consumption your body can sustain. Unlike a lab VO\u2082max test, VDOT is estimated from your race results, making it practical for every runner.',
  },
  {
    question: "How do I calculate my VDOT?",
    answer:
      'Select a race distance (800m to Marathon), enter your finish time, and press "Calculate VDOT." The calculator uses the Daniels & Gilbert oxygen-cost and time-limit equations to compute your VDOT score and all corresponding training paces.',
  },
  {
    question: "What are the 5 VDOT training zones?",
    answer: null,
    richContent: true,
  },
  {
    question: "Can I predict race times from my VDOT?",
    answer:
      "Yes. Once your VDOT is calculated from one race distance, the calculator predicts equivalent finish times for all standard distances from 800m to the marathon. These predictions assume equal training across all energy systems.",
  },
  {
    question: "What is a good VDOT score?",
    answer:
      "VDOT scores typically range from 20 to 85+. Beginner runners often score 20\u201330, recreational runners 30\u201340, competitive club runners 45\u201355, advanced runners 60\u201370, and elite athletes 70\u201385+. A 20:00 5K corresponds to roughly VDOT 50.",
  },
  {
    question: "How is VDOT different from VO\u2082max?",
    answer:
      'VO\u2082max is measured in a lab and reflects your maximum oxygen uptake. VDOT is a "pseudo VO\u2082max" estimated from race performance \u2014 it captures not just your aerobic ceiling but also your running economy and lactate tolerance. Two runners with the same lab VO\u2082max can have different VDOT scores.',
  },
];

export function VdotFaq() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">
        Frequently Asked Questions
      </h2>

      <Accordion type="single" collapsible defaultValue="item-0" className="space-y-3">
        {FAQ_ITEMS.map((item, idx) => (
          <AccordionItem
            key={idx}
            value={`item-${idx}`}
            className="bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-1 data-[state=open]:shadow-md transition-shadow"
          >
            <AccordionTrigger className="text-left font-medium text-gray-900 hover:no-underline py-4">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-gray-600 leading-relaxed pb-4">
              {item.richContent ? (
                <div className="space-y-2">
                  <p>Jack Daniels defines five training intensities:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>
                      <strong>Easy (E):</strong> 59&ndash;74% VO&#8322;max &mdash; Builds aerobic base and promotes recovery
                    </li>
                    <li>
                      <strong>Marathon (M):</strong> 75&ndash;84% VO&#8322;max &mdash; Marathon-specific endurance
                    </li>
                    <li>
                      <strong>Threshold (T):</strong> 83&ndash;88% VO&#8322;max &mdash; Improves lactate clearance at tempo pace
                    </li>
                    <li>
                      <strong>Interval (I):</strong> 95&ndash;100% VO&#8322;max &mdash; Maximizes aerobic capacity
                    </li>
                    <li>
                      <strong>Repetition (R):</strong> 105%+ VO&#8322;max &mdash; Develops speed and running economy
                    </li>
                  </ul>
                </div>
              ) : (
                <p>{item.answer}</p>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* The Science Behind VDOT */}
      <Accordion type="single" collapsible>
        <AccordionItem
          value="science"
          className="bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-1"
        >
          <AccordionTrigger className="text-left text-lg font-semibold text-gray-900 hover:no-underline py-4">
            The Science Behind VDOT
          </AccordionTrigger>
          <AccordionContent className="text-gray-600 leading-relaxed pb-5 space-y-4">
            <p>
              VDOT was developed by exercise physiologist and running coach{" "}
              <strong>Jack Daniels</strong>. It stands for &ldquo;V-dot-O&#8322;max&rdquo; &mdash;
              the rate of oxygen consumption &mdash; and represents your current
              running fitness level.
            </p>
            <h3 className="text-base font-semibold text-gray-900">
              How It Works
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>VO&#8322; cost equation:</strong> Calculates the oxygen
                cost of running at a given velocity: VO&#8322; = -4.6 + 0.182258v + 0.000104v&sup2;
              </li>
              <li>
                <strong>%VO&#8322;max equation:</strong> Estimates what fraction
                of your VO&#8322;max you can sustain for a given race duration
              </li>
              <li>
                <strong>VDOT = VO&#8322; / %VO&#8322;max:</strong> Dividing the
                oxygen cost by the sustainable fraction gives your effective VO&#8322;max
              </li>
            </ul>
            <p className="text-sm italic text-gray-500">
              Based on the Daniels &amp; Gilbert oxygen cost and time-limit
              equations from &ldquo;Daniels&rsquo; Running Formula&rdquo; (4th Edition).
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
