import Home from './pages/Home';
import WorkoutDetail from './pages/WorkoutDetail';
import Progress from './pages/Progress';
import Landing from './pages/Landing';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "WorkoutDetail": WorkoutDetail,
    "Progress": Progress,
    "Landing": Landing,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};