import { useNavigate } from 'react-router-dom';

/* Enum for route names*/
export enum RouteName {
  WelcomeScreen = 'WelcomeScreen',
  Home = 'Home',
}

/* Route parameters (if any route needs dynamic params) */
export type AppRouteParams = {
  [RouteName.WelcomeScreen]: undefined;
  [RouteName.Home]: undefined;
};

/* Actual paths for each route */
export const AppRoutes: Record<RouteName, string> = {
  [RouteName.WelcomeScreen]: '/',
  [RouteName.Home]: '/home',
};

/**
 * Typed navigation hook for React Router
 */
export const useTypedNavigation = () => {
  const navigate = useNavigate();

  return {
    goBack: () => navigate(-1),

    goTo: <T extends keyof AppRouteParams>(
      route: T,
      params?: AppRouteParams[T],
    ) => {
      let path = AppRoutes[route];

      if (params) {
        // replace :params in path
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            path = path.replace(`:${key}`, encodeURIComponent(String(value)));
          }
        });
        // add query string for leftover optional params
        const unusedParams = Object.entries(params).filter(
          ([key]) => !path.includes(key),
        );
        if (unusedParams.length) {
          const query = new URLSearchParams(
            unusedParams.map(([k, v]) => [k, String(v)]),
          ).toString();
          path += `?${query}`;
        }
      }

      navigate(path);
    },
  };
};

// Example Usage

// const { goTo } = useTypedNavigation();
// {() => goTo(RouteName.Home)}
// /time-selector/YouTube/com.google.android.youtube?icon=youtube-icon.png&currentLimitSeconds=3600
// onClick={() =>
//   goTo(RouteName.TimeSelector, {
//     appName: "YouTube",
//     packageName: "com.google.android.youtube",
//     icon: "youtube-icon.png",
//     currentLimitSeconds: 3600,
//   })
// }

// import { AppRoutes } from "./routes"; // <-- your file with AppRoutes

// export default function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path={AppRoutes.WelcomeScreen} element={<LandingPage />} />
//         <Route path={AppRoutes.Home} element={<Home />} />
//       </Routes>
//     </Router>
//   );
// }
