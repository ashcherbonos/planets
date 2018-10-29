import {Rim,Galaxy} from './galaxy.js';

let outerRimPlanets=[
    "planet_1_1",
    "planet_1_2",
    "planet_1_3",
    "planet_1_4",
    "planet_1_5",
    "planet_1_6",
    "planet_1_7",
    "planet_1_8",
    "planet_1_9",
    "planet_1_10",
    "planet_1_11",
    "planet_1_12",
];

let middleRimPlanets=[
    "planet_2_1",
    "planet_2_2",
    "planet_2_3",
    "planet_2_4",
    "planet_2_5",
    "planet_2_6",
];

let innerRimPlanets=[
    "planet_3_1",
    "planet_3_2",
    "planet_3_3",
    "planet_3_4",
];

let rims=[
    new Rim(outerRimPlanets,3,{x:48,y:48,r:50},"galaxy_outer_rim"),
    new Rim(middleRimPlanets,13,{x:50,y:42,r:52},"galaxy_middle_rim"),
    new Rim(innerRimPlanets,23,{x:50,y:48,r:52},"galaxy_inner_rim"),
];

let galaxy = new Galaxy(rims);
galaxy.Run();