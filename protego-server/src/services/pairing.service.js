import pairingRepository from "../repositories/pairing.repository.js";
import crypto from "crypto";

const pairingService = {
  generateCode: async (userId) => {
    const user = await pairingRepository.findById(userId);
    if (user.role !== "parent")
      throw new Error("Only parent can generate pairing code");
    if (user.pairedWith) throw new Error("Already paired");

    const code = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await pairingRepository.updateById(userId, {
      pairingCode: code,
      pairingCodeExpiry: expiry,
    });

    return { code, expiresAt: expiry };
  },

  joinWithCode: async (userId, code) => {
    const child = await pairingRepository.findById(userId);
    if (child.role !== "child")
      throw new Error("Only child can join with code");
    if (child.pairedWith) throw new Error("Already paired");

    const parent = await pairingRepository.findByPairingCode(code);
    if (!parent) throw new Error("Invalid or expired code");

    await pairingRepository.updateById(parent._id, {
      pairedWith: child._id,
      pairingCode: null,
      pairingCodeExpiry: null,
    });

    await pairingRepository.updateById(child._id, {
      pairedWith: parent._id,
    });

    return { message: "Paired successfully" };
  },

  unpair: async (userId) => {
    const user = await pairingRepository.findById(userId);
    if (!user.pairedWith) throw new Error("Not paired");

    await pairingRepository.updateById(user.pairedWith, { pairedWith: null });
    await pairingRepository.updateById(userId, { pairedWith: null });

    return { message: "Unpaired successfully" };
  },

  getPairedUser: async (userId) => {
    const user = await pairingRepository.findById(userId);
    if (!user.pairedWith) throw new Error("Not paired");

    const paired = await pairingRepository.findById(user.pairedWith);
    return { id: paired._id, name: paired.name, role: paired.role };
  },
};

export default pairingService;
