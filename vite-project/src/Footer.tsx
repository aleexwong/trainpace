import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="py-10 text-center text-sm text-black">
      <p className="text-sm">
        Built by a{" "}
        <Link
          to="/ethos"
          className="text-black hover:text-foreground focus:outline-none focus:ring transition-colors"
          aria-label="Read the TrainPace ethos"
        >
          runner
        </Link>{" "}
        for runners. © {new Date().getFullYear()} TrainPace.
      </p>
    </footer>
  );
};

export default Footer;
