import {Rim, Galaxy} from './galaxy.js';

let outerRimPlanets = [
    "planet_1_1",
    "planet_1_2",
    "planet_1_3",
    "planet_1_4",
    "planet_1_5",
    "planet_1_6",
];

let middleRimPlanets = [
    "planet_2_1",
    "planet_2_2",
    "planet_2_3",
];

let innerRimPlanets = [
    "planet_3_1",
    "planet_3_2",
];

let rims = [
    new Rim(outerRimPlanets, 3, {x:48, y:48, r:50}, "galaxy_outer_rim"),
    new Rim(middleRimPlanets, 13, {x:50, y:42, r:52}, "galaxy_middle_rim"),
    new Rim(innerRimPlanets, 23, {x:50, y:48, r:52}, "galaxy_inner_rim"),
];

let galaxy = new Galaxy(rims);
galaxy.Run();