const shipmentService = require('./shipmentService');
const vehicleService = require('./vehicleService');
const recommendationService = require('./recommendationService');

const functionDeclarations = [
  {
    name: "getShipmentStatus",
    description: "Get the current tracking status and event timeline of a specific shipment using its tracking number. Do not use this if the user hasn't provided a tracking number.",
    parameters: {
      type: "OBJECT",
      properties: {
        trackingNumber: { type: "STRING", description: "The tracking number, e.g., UPS123456789" }
      },
      required: ["trackingNumber"]
    }
  },
  {
    name: "getUserShipments",
    description: "Retrieve all confirmed shipments for the current authenticated user.",
    parameters: { type: "OBJECT", properties: {} }
  },
  {
    name: "getSavedDrafts",
    description: "Retrieve all draft (incomplete) shipments for the current user.",
    parameters: { type: "OBJECT", properties: {} }
  },
  {
    name: "getAvailableVehicles",
    description: "Find available vehicles matching a specific location and weight capacity.",
    parameters: {
      type: "OBJECT",
      properties: {
        location: { type: "STRING", description: "City or location name, e.g., Chennai" },
        weight: { type: "NUMBER", description: "Minimum capacity required in kg" }
      },
      required: ["location", "weight"]
    }
  },
  {
    name: "getShippingRecommendation",
    description: "Get ML-powered cost and time predictions for a new shipment.",
    parameters: {
      type: "OBJECT",
      properties: {
        from: { type: "STRING", description: "Origin city" },
        to: { type: "STRING", description: "Destination city" },
        weight: { type: "NUMBER", description: "Weight in kg" },
        height: { type: "NUMBER", description: "Height in cm" },
        width: { type: "NUMBER", description: "Width in cm" },
        length: { type: "NUMBER", description: "Length in cm" },
        deliveryOption: { type: "STRING", description: "Delivery preference: Economy, Normal, or Express" }
      },
      required: ["from", "to", "weight", "height", "width", "length", "deliveryOption"]
    }
  },
  {
    name: "createShipment",
    description: "Create a confirmed shipment. ONLY call this if the user has explicitly confirmed they want to create it and provided all package details and routing info.",
    parameters: {
      type: "OBJECT",
      properties: {
        from: { type: "STRING", description: "Origin city" },
        to: { type: "STRING", description: "Destination city" },
        package: {
          type: "OBJECT",
          properties: {
            weight: { type: "NUMBER" },
            height: { type: "NUMBER" },
            width: { type: "NUMBER" },
            length: { type: "NUMBER" },
            packageType: { type: "STRING", description: "document, parcel, fragile, electronics, or other" },
            fragile: { type: "BOOLEAN" }
          }
        },
        deliveryOption: { type: "STRING", description: "Economy, Normal, or Express" },
        transportMode: { type: "STRING", description: "Road, Rail, or Air" },
        cost: { type: "NUMBER", description: "Predicted cost" },
        estimatedTime: { type: "NUMBER", description: "Predicted time in hours" }
      },
      required: ["from", "to", "package", "deliveryOption", "transportMode"]
    }
  },
  {
    name: "cancelShipment",
    description: "Cancel a shipment. ONLY call this if the user has explicitly confirmed they want to cancel a specific tracking number.",
    parameters: {
      type: "OBJECT",
      properties: {
        trackingNumber: { type: "STRING", description: "The tracking number to cancel" }
      },
      required: ["trackingNumber"]
    }
  }
];

const executeTool = async (name, args, userId) => {
  try {
    switch (name) {
      case "getShipmentStatus":
        return await shipmentService.getShipmentStatus(args.trackingNumber);
      
      case "getUserShipments":
        // returns array
        const shipments = await shipmentService.getUserShipments(userId);
        return { count: shipments.length, shipments };
      
      case "getSavedDrafts":
        const drafts = await shipmentService.getSavedDrafts(userId);
        return { count: drafts.length, drafts };
        
      case "getAvailableVehicles":
        const vehicles = await vehicleService.getAvailableVehicles(args.location, args.weight);
        return { count: vehicles.length, vehicles };
        
      case "getShippingRecommendation":
        // This expects specific keys matching the FastAPI model
        // Add packageType to bypass Joi validation issue if there was one, though we proxy direct
        args.packageType = "parcel"; // default if missing for ML
        return await recommendationService.getShippingRecommendation(args);
        
      case "createShipment":
        return await shipmentService.createShipment(userId, args, 'web');
        
      case "cancelShipment":
        // Find shipmentId from trackingNumber first
        const status = await shipmentService.getShipmentStatus(args.trackingNumber);
        // Wait, getShipmentStatus returns a DTO without _id. Let's fix that or fetch direct.
        const Shipment = require('../models/Shipment');
        const shipmentDoc = await Shipment.findOne({ trackingNumber: args.trackingNumber, userId });
        if (!shipmentDoc) throw new Error("Shipment not found or unauthorized");
        return await shipmentService.cancelShipment(shipmentDoc._id, userId);
        
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return { error: error.message };
  }
};

module.exports = {
  functionDeclarations,
  executeTool
};