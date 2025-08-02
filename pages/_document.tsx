// pages/_document.tsx
import Document, { Html, Head, Main, NextScript } from "next/document";

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#f2c94c" />
        </Head>
        <body className="antialiased font-sans">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
