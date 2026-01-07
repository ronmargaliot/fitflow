import ActiveWorkout from './pages/ActiveWorkout';
import FullScreenTimer from './pages/FullScreenTimer';
import Home from './pages/Home';
import Landing from './pages/Landing';
import Profile from './pages/Profile';
import Progress from './pages/Progress';
import WorkoutDetail from './pages/WorkoutDetail';
import Notifications from './pages/Notifications';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ActiveWorkout": ActiveWorkout,
    "FullScreenTimer": FullScreenTimer,
    "Home": Home,
    "Landing": Landing,
    "Profile": Profile,
    "Progress": Progress,
    "WorkoutDetail": WorkoutDetail,
    "Notifications": Notifications,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};