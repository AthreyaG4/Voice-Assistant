import { createBrowserRouter, RouterProvider } from "react-router";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { SpotifyProvider } from "./context/spotify";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default function App() {
  return (
    <SpotifyProvider>
      <RouterProvider router={router} />
    </SpotifyProvider>
  );
}
