import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';


const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
 
// POST /api/auth/register
const Register = async (req,res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password)
            return res.status(400).json({ error: 'All fields required' });
        if (password.length < 6)
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
    
        const existing = await User.findOne({ email });
        if (existing) return res.status(409).json({ error: 'Email already registered' });
    
        const user = await User.create({ name, email, passwordHash: password });
        const token = signToken(user._id);
    
        res.status(201).json({ token, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: err.message });
    }
}

// POST /api/auth/login
const Login = async (req,res)=> {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
        const valid = await user.comparePassword(password);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    
        const token = signToken(user._id);
        res.json({ token, user });
    } catch (error) {
        res.status(500).json({ error: err.message });
    }
}


// GET /api/auth/me
const GetMe = (req,res) => {
    res.json({ user: req.user });
}


export {
    Register,
    Login,
    GetMe

}