/**
 * @module Models
 * @memberof! Models
 * @file Technology.js - This file is part of the Models module, it describes the Criterion class
 * @author dhmmasson
 */

import { EventEmitter } from "../EventEmitter.mjs";
import { definePrivateProperties } from "../utils.mjs";

/**
 * A class represent a group of technologies with the same dominance
 *
 * @property {number} dominance - number of technologies that are dominated by technology in that class
 * @property {number} rank - rank of the class
 * @property {number} centroid - centroid of the class
 * @property {number} centroidNormal - centroid of the class normalized to [0,1]
 * @property {number} count - number of technologies in the class
 *
 */
class Class {
  constructor() {
    (this.dominance = 0),
      (this.rank = 0),
      (this.centroid = 0),
      (this.centroidNormal = 0),
      (this.count = 0);
  }
}

/**
 * @extends EventEmitter
 * @property {string} name - Unique name of the criteria, to use to reference the criteria
 * @property {string} description - Full name to be used to be displayed
 * @property {Score}  min - Minimum value for the criteria in the database
 * @property {Score}  max - Maximum value for the criteria in the database
 * @property {number} weight - weight of the criteria for the score computation
 * @property {number} blurIntensity - [0-1] how much to extend the range [ evaluation - blurIntensity * ( max - min ), evaluation ]
 * @property {string} sortingorder - indicates whether the criterion is ascending or descending
 * @property {number} maxDominance - maximum number of technologies that are dominated by this criteria
 * @property {Class[]} classes - centroids of the classes map from rank to class NEED to be improved
 *
 *
 * @memberof! Models
 * @alias module:Models~Criterion
 */
class Criterion extends EventEmitter {
  /**
   * constructor - create a new criterion from a serialization of it (either from json or from the db)
   *
   * @param  {Object} serialization
   * @param  {string} serialization.name            - name of the criteria
   * @param  {string} [serialization.description=serialization.name]   - description of the criteria, name if absent
   * @param  {number} [serialization.min=0]           - min value for the criteria, 0 if absent
   * @param  {number} [serialization.max=5]           - max value for the criteria, 5 if absent

   */
  constructor({ name, description, min, max, sortingorder }) {
    super(Criterion.eventType);
    this.name = name;
    this.description = description || name;
    this.min = +min || 0;
    this.max = +max || 5;
    this.maxDominance = 0;
    this.classes = [];
    this.classCount = 0;
    this.sortingorder = sortingorder;
    definePrivateProperties(this, "_weight", "_blur");
  }

  /**
   * update - fire the event event:Criterion.eventType.updated
   * @return {void}
   * @memberof! module:Models~Criterion
   * @instance
   * @method
   * @public
   *
   * @fires module:Models~Criterion.eventType.updated
   * */

  update() {
    this.fire(Criterion.eventType.updated);
  }

  /**
   * blur - take an evaluation and blur it according to the intensity
   *
   * @param  {module:Models~Score} value the evaluation to blur
   * @return {Score}       the computed lower bound
   */
  blur(value) {
    // Clamp the value to 0--5
    const order = this.sortingorder === "ascending" ? -2 : 2;
    const range = this.max - this.min;
    const blur = order * this.blurIntensity * range;
    return Math.min(this.max, Math.max(this.min, value + blur));
  }

  /**
   * set - Change the weight of this criteria in the final mix
   *
   * fire the event event:Criterion.eventType.weightUpdated followed by event event:Criterion.eventType.updated
   * @param  {number} newWeight the new weight. 0 indicate that the criteria is not considered in the final mix. There is no normalisation for now.
   * @return {number} return the new weight
   */
  set weight(newWeight) {
    this._weight = Math.max(0, newWeight);
    this.fire(Criterion.eventType.weightUpdated);
    this.fire(Criterion.eventType.updated);
    return newWeight;
  }

  /**
   * get - get the weight associated to this criteria.
   *
   * @return {number}  the weight. 0 means that the criteria should not be considered
   */
  get weight() {
    return this._weight || 0;
  }

  /**
   * set - fire the event event:Criterion.eventType.blurIntensityUpdated followed by event event:Criterion.eventType.updated
   *
   * @param  {number} intensity a 0-1 value. 0 mean no blurring should be applied ( exact values ) 1 mean all values for this technology are the same. .5 means that A dominate B if B value is smaller than A - .5 * ( range )
   * @return {number} return the intensity
   */
  set blurIntensity(intensity) {
    this._blur = Math.max(0, intensity);
    this.fire(Criterion.eventType.blurIntensityUpdated);
    this.fire(Criterion.eventType.updated);
    return intensity;
  }

  /**
   * get - return the intensity of the blur
   *
   * @return {number} a value between 0 and 1.
   */
  get blurIntensity() {
    return this._blur || 0;
  }

  /**
   * export - return the name, the weight and the blur intensity of a technology
   *
   * @return {number} the name, the weight and the blur intensity.
   */
  export() {
    return {
      name: this.name,
      weight: this.weight,
      blurIntensity: this.blurIntensity,
    };
  }
}

/**
 * Criterion.eventType
 * @enum {string}
 * @readonly
 * @memberof! module:Models~Criterion
 */
Criterion.eventType = {
  /** called when the criteria is changed */
  updated: "updated",

  /** called when the blurIntensity is changed */
  blurIntensityUpdated: "blurIntensityUpdated",

  /** called when the weightUpdated is changed */
  weightUpdated: "weightUpdated",
};

export { Criterion };
