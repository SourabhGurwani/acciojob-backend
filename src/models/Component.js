import mongoose from 'mongoose';

const componentSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['button', 'card', 'modal', 'form', 'layout', 'custom'],
    default: 'custom'
  },
  jsxCode: { 
    type: String, 
    required: true 
  },
  cssCode: { 
    type: String, 
    required: true 
  },
  testCode: {
    type: String,
    default: ''
  },
  storybookCode: {
    type: String,
    default: ''
  },
  presetType: {
    type: String,
    enum: ['REACT', 'MUI'],
    default: 'REACT'
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  chatHistory: [{
    role: { 
      type: String, 
      enum: ['user', 'ai'] 
    },
    content: String,
    timestamp: { 
      type: Date, 
      default: Date.now 
    }
  }],
  versions: [{
    jsxCode: String,
    cssCode: String,
    testCode: String,
    storybookCode: String,
    createdAt: { 
      type: Date, 
      default: Date.now 
    }
  }]
}, { 
  timestamps: true 
});

// Add text index for search
componentSchema.index({
  name: 'text',
  'chatHistory.content': 'text'
});

const Component = mongoose.model('Component', componentSchema);
export default Component;