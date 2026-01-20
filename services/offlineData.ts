
export interface ResourceItem {
  title: string;
  content: string;
}

export const EMERGENCY_INSTRUCTIONS: ResourceItem[] = [
  {
    title: "Chest Pain / Heart Attack",
    content: "1. Call emergency services immediately. 2. Sit and rest. 3. If prescribed, take nitroglycerin. 4. If not allergic, chew an aspirin."
  },
  {
    title: "Choking (Heimlich Maneuver)",
    content: "1. Stand behind the person. 2. Wrap arms around waist. 3. Make a fist and place it above the navel. 4. Give quick, upward thrusts."
  },
  {
    title: "Severe Bleeding",
    content: "1. Apply direct pressure to the wound with a clean cloth. 2. Elevate the limb. 3. Do not remove the cloth if soaked; add more on top."
  },
  {
    title: "Stroke Symptoms (FAST)",
    content: "F: Face drooping. A: Arm weakness. S: Speech difficulty. T: Time to call emergency services."
  }
];

export const CACHED_FAQS: ResourceItem[] = [
  {
    title: "How do I check a fever?",
    content: "Use a digital thermometer. A normal temperature is around 98.6°F (37°C). A fever is generally considered 100.4°F (38°C) or higher."
  },
  {
    title: "What is the best way to clean a wound?",
    content: "Rinse with cool water for several minutes. Use mild soap to clean the surrounding area, but avoid getting soap in the wound itself."
  },
  {
    title: "How much water should I drink daily?",
    content: "While it varies, a general rule is about 8-10 glasses (2 liters) per day for most healthy adults."
  },
  {
    title: "How do I treat a minor burn?",
    content: "Run cool (not cold) water over the area for 10-20 minutes. Apply an antibiotic ointment and cover with a clean bandage."
  }
];
