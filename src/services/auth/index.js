import dotenv from "dotenv";
import nodemailer from "nodemailer";
import randomToken from "random-token";
import bcrypt from "bcrypt";
import url from "url";
import { userModel } from "../../schemas/user.schema.js";
import { passwordResetModel } from "../../schemas/passwordResets.schema.js";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { isoUint8Array } from "@simplewebauthn/server/helpers";

import jwt from "jsonwebtoken";
import log4js from "log4js";

const logger = log4js.getLogger("Auth");
logger.level = process.env.LOG_LEVEL;

dotenv.config();

let challenges = {};

const rpName = "Farm Control";
const rpID = url.parse(process.env.APP_URL_CLIENT).host;
const origin = `https://${rpID}`;

const transporter = nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASSWORD,
  },
});

function generateToken() {

}


export const getAuthModesHandler = async (req, res, email) => {
  let foundUser = await userModel.findOne({ email: email });
  if (foundUser == null) {
    return res.status(400).json({
      error: "Invalid email address.",
    });
  }
  if (foundUser.webAuthnCredentials.length > 0) {
    return res.status(200).json({
      authModes: ["password", "passkey"],
    });
  } else {
    return res.status(200).json({
      authModes: ["password"],
    });
  }
};

export const loginRouteHandler = async (req, res, email, password) => {
  //Check If User Exists
  let foundUser = await userModel.findOne({ email: email });
  if (foundUser == null) {
    return res.status(400).json({
      error: "Invalid credentials.",
    });
  } else {
    const validPassword = await bcrypt.compare(password, foundUser.password);
    if (validPassword) {
      // Generate JWT token
      const token = jwt.sign(
        { id: foundUser.id, email: foundUser.email },
        process.env.JWT_SECRET,
        {
          expiresIn: "24h",
        }
      );
      return res.json({
        user: {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
        },
        access_token: token,
      });
    } else {
      return res.status(400).json({
        error: "Invalid credentials.",
      });
    }
  }
};

export const validateTokenRouteHandler = async (req, res, token) => {
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    res.status(200).send({
      status: "OK",
    });
  } catch (err) {
    console.error("Token verification error:", err);
    res.status(401).send("Invalid token");
  }
};

export const registerPasskeyRouteHandler = async (req, res) => {
  // check to see if the request has provided a user
  const user = req.user;
  if (!user) {
    // if no user exists
    return res.status(400).json({ error: "User not specified." });
  }
  if (req.body.token) {
    const options = await generateRegistrationOptions({
      rpName: rpName,
      rpID: rpID,
      userName: user.email,
      userDisplayName: user.name,
      excludeCredentials: user.webAuthnCredentials.map(
        (webAuthnCredential) => ({
          id: webAuthnCredential.id,
          transports: webAuthnCredential.transports,
        })
      ),
      attestationType: "none",
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
        authenticatorAttachment: "platform",
      },
    });

    challenges[user.id] = options.challenge;
    return res.status(200).send(options);
  }

  const expectedChallenge = challenges[user.id];
  const attestationResponse = req.body;

  let verification;

  try {
    verification = await verifyRegistrationResponse({
      response: attestationResponse,
      expectedChallenge,
      expectedOrigin: process.env.APP_URL_CLIENT,
      expectedRPID: url.parse(process.env.APP_URL_CLIENT).host,
    });

    const { registrationInfo } = verification;
    const {
      credentialID,
      credentialPublicKey,
      counter,
      credentialDeviceType,
      credentialBackedUp,
    } = registrationInfo;

    const webAuthnCredential = {
      id: credentialID,
      publicKey: Buffer.from(new Uint8Array(credentialPublicKey)),
      counter,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      transports: attestationResponse.response.transports,
    };

    console.log(webAuthnCredential);
    user.webAuthnCredentials.push(webAuthnCredential);

    await user.save();
    res.status(200).send({ status: "OK" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: error.message });
  }

  if (verification.verified) {
  } else {
    res.status(400).send({ error: "Not verified." });
  }
};

export const loginPasskeyRouteHandler = async (
  req,
  res,
  email,
  attestationResponse
) => {
  if (!email) {
    return;
  }
  let user = await userModel.findOne({ email: email });
  if (user == null) {
    return res.status(400).json({
      error: "Invalid email address.",
    });
  }
  if (attestationResponse) {
    logger.info("Verfifying challenge...");
    const expectedChallenge = challenges[user.id];
    let verification;
    try {
      const webAuthnCredentialIndex = user.webAuthnCredentials.findIndex(
        (cred) => cred.id === attestationResponse.id
      );
      const webAuthnCredential = user.webAuthnCredentials[webAuthnCredentialIndex];
      verification = await verifyAuthenticationResponse({
        response: attestationResponse,
        expectedChallenge,
        expectedOrigin: process.env.APP_URL_CLIENT,
        expectedRPID: url.parse(process.env.APP_URL_CLIENT).host,
        authenticator: {
          credentialID: webAuthnCredential.id,
          credentialPublicKey: new Uint8Array(webAuthnCredential.publicKey),
          counter: webAuthnCredential.counter,
          transports: webAuthnCredential.transports,
        },
      });
      user.webAuthnCredentials[webAuthnCredentialIndex].counter = verification.authenticationInfo.newCounter; // Update connection counter
      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        {
          expiresIn: "24h",
        }
      );

      return res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        access_token: token,
      });

    } catch (error) {
      console.log(error);
      res.status(400).send({ error });
    }
  } else {
    // Get options
    logger.info("Sending authentication options...");
    const options = await generateAuthenticationOptions({
      rpID: url.parse(process.env.APP_URL_CLIENT).host,
      allowCredentials: user.webAuthnCredentials.map((cred) => ({
        id: cred.id,
        type: "public-key",
        transports: cred.transports,
      })),
    });
    challenges[user.id] = options.challenge;
    res.status(200).send(options);
  }
};

export const registerRouteHandler = async (req, res, name, email, password) => {
  // check if user already exists
  let foundUser = await userModel.findOne({ email: email });
  if (foundUser) {
    // does not get the error
    return res.status(400).json({ message: "Email is already in use" });
  }

  // check password to exist and be at least 8 characters long
  if (!password || password.length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters long." });
  }

  // hash password to save in db
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);

  const newUser = new userModel({
    name: name,
    email: email,
    password: hashPassword,
  });
  await newUser.save();

  // Generate JWT token
  const token = jwt.sign({ id: newUser.id, email: newUser.email }, "token", {
    expiresIn: "24h",
  });
  return res.status(200).json({
    token_type: "Bearer",
    expires_in: "24h",
    access_token: token,
    refresh_token: token,
  });
};

export const forgotPasswordRouteHandler = async (req, res, email) => {
  let foundUser = await userModel.findOne({ email: email });

  if (!foundUser) {
    return res.status(400).json({
      errors: { email: ["The email does not match any existing user."] },
    });
  } else {
    let token = randomToken(20);
    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: "admin@jsonapi.com", // sender address
      to: email, // list of receivers
      subject: "Reset Password", // Subject line
      html: `<p>You requested to change your password.If this request was not made by you please contact us. Access <a href='${process.env.APP_URL_CLIENT}/auth/reset-password?token=${token}&email=${email}'>this link</a> to reste your password </p>`, // html body
    });
    const dataSent = {
      data: "password-forgot",
      attributes: {
        redirect_url: `${process.env.APP_URL_API}/password-reset`,
        email: email,
      },
    };

    // save token in db
    await passwordResetModel.create({
      email: foundUser.email,
      token: token,
      created_at: new Date(),
    });

    return res.status(204).json(dataSent);
  }
};

export const resetPasswordRouteHandler = async (req, res) => {
  const foundUser = await userModel.findOne({
    email: req.body.data.attributes.email,
  });

  if (!foundUser || !foundToken) {
    return res.status(400).json({
      errors: {
        email: ["The email or token does not match any existing user."],
      },
    });
  } else {
    const { password, password_confirmation } = req.body.data.attributes;
    // validate password
    if (password.length < 8) {
      return res.status(400).json({
        errors: {
          password: ["The password should have at lest 8 characters."],
        },
      });
    }

    if (password != password_confirmation) {
      return res.status(400).json({
        errors: {
          password: ["The password and password confirmation must match."],
        },
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    await passwordResetModel.deleteOne({ email: foundUser.email });

    await userModel.updateOne(
      { email: foundUser.email },
      { $set: { password: hashPassword } }
    );
    return res.sendStatus(204);
  }
};
