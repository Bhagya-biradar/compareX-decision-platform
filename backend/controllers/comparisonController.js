import Comparison from '../models/Comparison.js';
import { calculateWinner, normalizeComparisonInput } from '../utils/comparison.js';

const buildInvalidPayloadMessage = (message) => ({ message });

const createComparison = async (req, res) => {
  const payload = normalizeComparisonInput(req.body);

  if (!payload.title) {
    return res.status(400).json(buildInvalidPayloadMessage('Title is required'));
  }

  if (payload.options.length < 2) {
    return res.status(400).json(buildInvalidPayloadMessage('At least two options are required'));
  }

  if (payload.criteria.length < 1) {
    return res.status(400).json(buildInvalidPayloadMessage('At least one criterion is required'));
  }

  const { winner } = calculateWinner(payload.options, payload.criteria, payload.scores);

  const comparison = await Comparison.create({
    title: payload.title,
    options: payload.options,
    criteria: payload.criteria,
    scores: payload.scores,
    result: winner,
    createdBy: req.user.id,
  });

  return res.status(201).json(comparison);
};

const getComparisons = async (req, res) => {
  const comparisons = await Comparison.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
  return res.json(comparisons);
};

const getComparisonById = async (req, res) => {
  const comparison = await Comparison.findById(req.params.id);

  if (!comparison) {
    return res.status(404).json({ message: 'Comparison not found' });
  }

  if (comparison.createdBy.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Not authorized to access this comparison' });
  }

  return res.json(comparison);
};

const updateComparison = async (req, res) => {
  const comparison = await Comparison.findById(req.params.id);

  if (!comparison) {
    return res.status(404).json({ message: 'Comparison not found' });
  }

  if (comparison.createdBy.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Not authorized to update this comparison' });
  }

  const payload = normalizeComparisonInput(req.body);

  if (!payload.title) {
    return res.status(400).json(buildInvalidPayloadMessage('Title is required'));
  }

  if (payload.options.length < 2) {
    return res.status(400).json(buildInvalidPayloadMessage('At least two options are required'));
  }

  if (payload.criteria.length < 1) {
    return res.status(400).json(buildInvalidPayloadMessage('At least one criterion is required'));
  }

  const { winner } = calculateWinner(payload.options, payload.criteria, payload.scores);

  comparison.title = payload.title;
  comparison.options = payload.options;
  comparison.criteria = payload.criteria;
  comparison.scores = payload.scores;
  comparison.result = winner;

  const updatedComparison = await comparison.save();
  return res.json(updatedComparison);
};

const deleteComparison = async (req, res) => {
  const comparison = await Comparison.findById(req.params.id);

  if (!comparison) {
    return res.status(404).json({ message: 'Comparison not found' });
  }

  if (comparison.createdBy.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Not authorized to delete this comparison' });
  }

  await comparison.deleteOne();
  return res.json({ message: 'Comparison deleted successfully' });
};

export { createComparison, getComparisons, getComparisonById, updateComparison, deleteComparison };
