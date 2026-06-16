import User from "../models/user.model.js";

const pairingRepository = {
 
    findByPairingCode: async (code) => {
        return await User.findOne({
            pairingCode: code,
            pairingCodeExpiry: { $gt: new Date() }
        });
    },

    updateById : async (id , data) =>{
        return await User.findByIdAndUpdate(id, data, { new: true });
    },

    findById : async (id) =>{
        return await User.findById(id);
    }
}
export default pairingRepository;