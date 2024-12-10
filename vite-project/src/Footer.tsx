const Footer = () => {
  return (
    <footer className="fixed bottom-0 left-0 w-full bg-gray-100 p-2 text-center m-1">
      <p className="text-sm text-gray-600">
        made with <span className="text-red-500">❤️</span> in vancouver, bc.
        <br />
        <a
          href="https://github.com/aleexwong/trainingpacecalculator2"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          Check out the project on GitHub
        </a>
      </p>
    </footer>
  );
};

export default Footer;
