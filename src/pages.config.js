import Home from './pages/Home';
import WorkoutDetail from './pages/WorkoutDetail';
import Progress from './pages/Progress';
import Landing from './pages/Landing';
import ActiveWorkout from './pages/ActiveWorkout';
import FullScreenTimer from './pages/FullScreenTimer';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "WorkoutDetail": WorkoutDetail,
    "Progress": Progress,
    "Landing": Landing,
    "ActiveWorkout": ActiveWorkout,
    "FullScreenTimer": FullScreenTimer,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};