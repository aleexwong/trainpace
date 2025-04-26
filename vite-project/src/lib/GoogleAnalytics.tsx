// GoogleAnalytics.js
import ReactGA from "react-ga4";
import { Helmet } from "react-helmet-async";
ReactGA.initialize("G-VT160XERPB");

const GoogleAnalytics = () => (
  <Helmet>
    <script
      async
      src="https://www.googletagmanager.com/gtag/js?id=G-VT160XERPB"
    ></script>
    <script>
      {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-VT160XERPB');
      `}
    </script>
  </Helmet>
);

export default GoogleAnalytics;
