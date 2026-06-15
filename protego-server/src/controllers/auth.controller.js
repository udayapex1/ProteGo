import authService from "../services/auth.service.js";


const authControllers = {
    register : async (req, res) => {
        try {
            const result = await authService.register(req.body);
            res.status(201).json(result);
        } catch (error) {
             res.status(400).json({ message: error.message });
        }
    }
}
