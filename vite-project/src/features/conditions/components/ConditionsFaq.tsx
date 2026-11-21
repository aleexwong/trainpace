/**
 * ConditionsFaq — the reasoning behind the numbers, kept visible for SEO and
 * because a prediction a runner doesn't understand is a prediction they won't
 * trust on start line morning.
 */

import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function ConditionsFaq() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8 space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          Racing in heat and at altitude
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Why the forecast changes your goal, and what to do about it
        </p>
      </div>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900">
          Why dew point, not humidity
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          Relative humidity on its own tells you almost nothing &mdash; 90% at
          10&deg;C is a pleasant morning, 60% at 30&deg;C is punishing.{" "}
          <strong>Dew point</strong> measures how much moisture the air actually
          holds, which sets the ceiling on evaporation. Sweat only cools you when
          it evaporates; when the dew point is high, it just runs off you and
          your core temperature keeps climbing. That&rsquo;s why this calculator
          works from the sum of air temperature and dew point rather than from
          the temperature you see on the forecast app.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900">
          Why the marathon suffers more than the 5K
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          Heat is cumulative. A 5K finishes before core temperature has climbed
          far, so the penalty stays small. A marathon spends three or four hours
          generating heat faster than the body can shed it, and the cost
          compounds &mdash; which is why the same forecast might cost you 30
          seconds over 5K and eight minutes over 42.2K. This calculator scales
          the penalty by how long you&rsquo;ll actually be out there rather than
          applying one flat percentage.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900">
          What altitude does
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          Thinner air means less oxygen per breath, so VO&#8322;max drops &mdash;
          roughly 1.8% for every 300 m above about 300 m of elevation, for a
          runner arriving from sea level. Because that&rsquo;s a hit to aerobic
          capacity rather than to cooling, we model it by reducing your VDOT and
          re-predicting the race from there, which is why the altitude penalty
          grows naturally with distance. Two or more weeks living at elevation
          recovers part of the deficit, but never all of it &mdash; tick the
          acclimatised box to see the difference.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900">
          How to use the estimate
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          Use the adjusted time to plan how much your pace may change. Follow
          your race organizer&rsquo;s instructions and local heat alerts when
          deciding whether to run. If you feel faint or weak, stop exercising
          and move somewhere cool.{" "}
          <a
            className="underline"
            href="https://www.cdc.gov/extreme-heat/risk-factors/extreme-heat-and-athletes.html"
          >
            CDC guidance for athletes in extreme heat
          </a>
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900">
          How accurate is this?
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          Heat tolerance varies by runner. This pace model uses air temperature
          and dew point. Sun and wind also affect heat stress, and race organizers
          may use wet-bulb globe temperature to guide event decisions.{" "}
          <a className="underline" href="https://www.weather.gov/tsa/wbgt">
            National Weather Service explanation of wet-bulb globe temperature
          </a>
        </p>
      </section>

      <div className="pt-2 border-t border-gray-100">
        <Link
          to="/vdot"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
        >
          Don&rsquo;t know your goal time yet? Start with the VDOT calculator
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
