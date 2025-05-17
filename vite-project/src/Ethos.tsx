import { Helmet } from "react-helmet-async";

export default function Ethos() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Helmet>
        <title>Ethos – TrainPace</title>
        <meta
          name="description"
          content="TrainPace is for runners who take ownership. No noise. No fluff. Just pace, tools, and momentum."
        />
      </Helmet>

      <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-foreground">
        TrainPace Ethos
      </h1>

      <div className="space-y-6 text-base sm:text-lg leading-relaxed text-foreground">
        <p>
          We’re not against coaching.
          <br />
          We’re against waiting.
        </p>

        <p>
          TrainPace is for runners who take ownership. No medals required. No
          plan needed. Just intent, movement, and return.
        </p>

        <p>
          We believe performance is earned — not handed down. That tools should
          support action, not slow it. That momentum is built, not bought.
        </p>

        <p>
          This is for those who show up quietly. Who run without permission. Who
          train because it matters.
        </p>

        <p className="text-center font-semibold text-xl sm:text-2xl mt-10">
          Just pace, tools, and ownership.
        </p>
      </div>
    </div>
  );
}
