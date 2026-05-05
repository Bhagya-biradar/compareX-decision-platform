import mongoose from 'mongoose';

const comparisonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length >= 2,
        message: 'At least two options are required',
      },
    },
    criteria: {
      type: [
        {
          name: {
            type: String,
            required: true,
            trim: true,
          },
          weight: {
            type: Number,
            required: true,
            min: 0,
          },
        },
      ],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length >= 1,
        message: 'At least one criterion is required',
      },
    },
    scores: {
      type: Object,
      required: true,
      default: {},
    },
    result: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Comparison = mongoose.model('Comparison', comparisonSchema);

export default Comparison;
