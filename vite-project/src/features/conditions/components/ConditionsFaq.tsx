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
          How to race it
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          The single biggest mistake in a hot race is going out at the original
          goal pace and hoping. Heat penalties are not linear: a runner who
          banks time early pays it back with interest, because once core
          temperature is elevated you cannot recover it mid-race. Start at the
          adjusted pace, take fluid early rather than when you feel thirsty, and
          pour water on your head and forearms &mdash; skin cooling buys real
          time. Then reassess at halfway, when you know what kind of day it is.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900">
          How accurate is this?
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          It&rsquo;s a well-supported estimate of the <em>typical</em> response,
          not a promise. Individual heat tolerance varies widely, and runners who
          have trained through a hot summer handle the same conditions better
          than someone stepping off a plane from a cold climate. Sun exposure,
          wind, and a shaded versus open course all shift the number too. Treat
          the adjusted time as a realistic target band, not a split to defend.
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
