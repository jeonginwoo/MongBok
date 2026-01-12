import { StrictMode } from "react";
import "../css/index.css"; // Assuming css directory is now at root

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <StrictMode>{children}</StrictMode>
      </body>
    </html>
  );
}
