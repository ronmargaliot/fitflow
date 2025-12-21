import ActiveWorkout from './pages/ActiveWorkout';
import FullScreenTimer from './pages/FullScreenTimer';
import Home from './pages/Home';
import Landing from './pages/Landing';
import Progress from './pages/Progress';
import WorkoutDetail from './pages/WorkoutDetail';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ActiveWorkout": ActiveWorkout,
    "FullScreenTimer": FullScreenTimer,
    "Home": Home,
    "Landing": Landing,
    "Progress": Progress,
    "WorkoutDetail": WorkoutDetail,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};