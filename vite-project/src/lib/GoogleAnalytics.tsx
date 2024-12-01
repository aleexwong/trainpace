// GoogleAnalytics.js
import { Helmet } from "react-helmet-async";

const GoogleAnalytics = () => (
  <Helmet>
    <script
      async
      src="https://www.googletagmanager.com/gtag/js?id=G-VCYJ0P12DG"
    ></script>
    <script>
      {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-VCYJ0P12DG');
      `}
    </script>
  </Helmet>
);

export default GoogleAnalytics;
