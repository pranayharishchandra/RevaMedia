import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {

	try {
		const { fullName, username, email, password } = req.body;

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({ error: "Invalid email format" });
		}

		const existingUser = await User.findOne({ username });
		if (existingUser) {
			return res.status(400).json({ error: "Username is already taken" });
		}

		const existingEmail = await User.findOne({ email });
		if (existingEmail) {
			return res.status(400).json({ error: "Email is already taken" });
		}

		if (password.length < 6) {
			return res.status(400).json({ error: "Password must be at least 6 characters long" });
		}

		const salt           = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		// newUser is a document and then if new document was returned, save to DB, and return to frontend (not Document, but after converting into JSON format)
		const newUser = new User({
			fullName,
			username,
			email,
			password: hashedPassword,
		});

		if (newUser) {
			generateTokenAndSetCookie(newUser._id, res);
			await newUser.save();

			res.status(201).json({
				_id       : newUser._id,
				fullName  : newUser.fullName,
				username  : newUser.username,
				email     : newUser.email,
				followers : newUser.followers,
				following : newUser.following,
				profileImg: newUser.profileImg,
				coverImg  : newUser.coverImg,
			});
		} else {
			res.status(400).json({ error: "Invalid user data" });
		}
	} catch (error) {
		console.log("Error in signup controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const login = async (req, res) => {

	try {
		const { username, password } = req.body;
		const user                   = await User.findOne({ username });
		const isPasswordCorrect      = await bcrypt.compare(password, user?.password || "");

		if (!user || !isPasswordCorrect) {
			return res.status(400).json({ error: "Invalid username or password" });
		}

		generateTokenAndSetCookie(user._id, res);

/* //?for directly sending object to frontend
* const user = await User.findOne({ username }).lean(); // Use .lean() to get a plain object
res.status(200).json(user); // Now user is a plain object

* or do 

const user = await User.findOne({ username });
* res.status(200).json(user.toObject()); // Convert Mongoose document to plain object

*/

		//! dont' directly do: res.status(200).json(user) // since users collection (first change it to js object.. see comment above)
		res.status(200).json({
			_id       : user._id,
			fullName  : user.fullName,
			username  : user.username,
			email     : user.email,
			followers : user.followers,
			following : user.following,
			profileImg: user.profileImg,
			coverImg  : user.coverImg,
		});
	} catch (error) {
		console.log("Error in login controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const logout = async (req, res) => {
	try {
		res.cookie("jwt", "", { maxAge: 0 });
		res.status(200).json({ message: "Logged out successfully" });
	} catch (error) {
		console.log("Error in logout controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const getMe = async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select("-password");
		res.status(200).json(user);
	} catch (error) {
		console.log("Error in getMe controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

/**
 * const user         = await User.findById(req.user._id).select("-password");
 * const existingUser = await User.findOne({ username });
 */