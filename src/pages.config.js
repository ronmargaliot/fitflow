import Home from './pages/Home';
import WorkoutDetail from './pages/WorkoutDetail';
import ActiveWorkout from './pages/ActiveWorkout';
import Progress from './pages/Progress';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "WorkoutDetail": WorkoutDetail,
    "ActiveWorkout": ActiveWorkout,
    "Progress": Progress,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};