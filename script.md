# Aahaar CMS - Project Demonstration Script

**Target Length:** 3-4 minutes  
**Presenter:** Parth Khandelwal (Team Member 2)  
**Format:** Talking head with screen demonstration  
**Target Audience:** Project evaluators (Projexa upload)

---

## SCRIPT

### [INTRODUCTION - 0:00-0:45]
**[Talking head - Parth]**
"Hello everyone, I'm Parth Khandelwal, B.Tech CSE (Full Stack) - A, student ID 2301350013. Today I'll be demonstrating Aahaar CMS - our comprehensive food court management platform."

"This project solves the chaos of traditional food court operations by providing a unified system that connects administrators, vendors, and customers in real-time, eliminating order errors and reducing wait times."

### [PROJECT DESCRIPTION - 0:45-1:30]
**[Talking head - Parth]**
"We chose this project after observing how food courts struggle with manual order tracking, payment discrepancies, and inefficient communication between stakeholders."

"Built with Next.js 15, React 19, Sequelize ORM, MySQL, and Razorpay payment integration, our platform features three distinct portals: Admin for overall management, Vendor for order preparation, and Customer for seamless ordering."

"Key features include real-time order synchronization (<200ms latency), automated payment splitting, role-based access control, and multi-vendor cart functionality allowing customers to order from multiple stalls in a single transaction."

### [DEMONSTRATION - 1:30-3:15]
**[Screen recording - Admin Login]**
"Let me start by logging into the admin portal. I'll use the test credentials generated from our database reset: admin@krmu.edu.in with password Admin@123. As Aryan Sharma, our team lead (2301350002), I have super admin access to oversee the entire food court ecosystem."

**[Screen recording - Admin Dashboard]**
"Here's the admin dashboard showing real-time analytics: total orders, revenue breakdown, and vendor performance metrics. Notice how we can see live order updates coming in from all vendors."

**[Screen recording - Admin Vendors Management]**
"From the vendors section, I can manage all stall owners - approve new vendors, update menu items, and monitor inventory levels. Let me show you how a new vendor gets onboarded."

**[Screen recording - Vendor Login]**
"Now switching to the vendor perspective. I'm logging in as a biryani stall vendor - 'The Desi Kitchen' - using the test credentials: ramesh.sharma@krmu.edu.in with password Vendor@123. This vendor stall was set up by Kavyansh Singh (member 3, 2301350010) during our database seeding."

**[Screen recording - Vendor Dashboard]**
"This is the vendor's main interface. Orders appear in real-time as customers place them - you can see the live updates happening right now. The kitchen queuing system shows orders moving from 'Upcoming' to 'In Kitchen' to 'Ready' status."

**[Screen recording - Customer App]**
"Switching to the customer experience, I'm accessing our platform via QR code scan - no app download needed thanks to PWA technology. For demonstration, I'll use the test customer account: student@krmu.edu.in with password Student@123. Here I can browse all available vendors, view menus, and add items from multiple stalls to my cart."

**[Screen recording - Customer Checkout]**
"Notice how I've selected biryani from 'The Desi Kitchen' and juice from 'South Spice' - all in a single cart. I proceed to Razorpay payment (using test card details), receive an OTP for verification, and now I just wait for my order notification."

**[Screen recording - Vendor Order Completion]**
"Back on the vendor side, when the customer arrives with their OTP, we verify it here and mark the order as complete. The system automatically handles payment splitting - the platform fee (2.5%) is deducted and the rest goes directly to the vendor's account. This demonstrates the payment integration work done by Aastha Srivastava (member 4, 2301350027)."

**[Screen recording - Customer Order Status]**
"And finally, on the customer app using student@krmu.edu.in, I receive a notification that my order is ready for pickup - no more standing in line or wondering where my food is. This end-to-end flow demonstrates what Prathviraj (member 5, 2301350018) helped implement regarding real-time notifications."

### [CHALLENGES AND SOLUTIONS - 3:15-3:50]
**[Talking head - Parth]**
"Our biggest challenge was implementing real-time synchronization across all three portals with sub-200ms latency. We solved this by optimizing our database queries and implementing efficient WebSocket connections for live updates."

"Another significant hurdle was ensuring secure payment splitting while maintaining compliance with financial regulations. We addressed this by integrating Razorpay's split payment feature and implementing robust server-side validation for all financial transactions."

### [CONCLUSION - 3:50-4:00]
**[Talking head - Parth]**
"In summary, Aahaar CMS transforms food court operations by providing a single source of truth for all stakeholders. We've reduced order errors by eliminating manual processes and improved customer satisfaction through transparency and efficiency."

"This project represents the collaborative effort of our five-member team: Aryan Sharma (Team Leader - 2301350002), myself Parth Khandelwal (2301350013), Kavyansh Singh (2301350010), Aastha Srivastava (2301350027), and Prathviraj (2301350018). Each of us contributed critical components to make this platform production-ready."

"As shown by our database reset, the platform comes pre-seeded with: one court (KR Mangalam University), one admin account (admin@krmu.edu.in/Admin@123), one customer account (student@krmu.edu.in/Student@123), and three vendor accounts (all with password Vendor@123) representing different cuisines - North Indian, South Indian, and Fast Food."

"Looking ahead, we plan to add AI-powered demand forecasting and inventory management capabilities to further optimize vendor operations. Thank you for watching our demonstration."

---

## Delivery Notes

| Element | Guidance |
|---------|----------|
| **Tone** | Confident, knowledgeable, enthusiastic about the solution |
| **Pacing** | Steady during introduction, slightly faster during demo excitement |
| **Screen recordings** | Pre-load all pages to avoid loading delays, use smooth transitions |
| **Visual Focus** | Highlight real-time updates and seamless role transitions |

## Visual Pairing Suggestions

| Timestamp | Visual |
|-----------|--------|
| 0:00-0:45 | Talking head: Parth introducing himself and project |
| 0:45-1:30 | Talking head: Parth explaining project motivation and tech stack |
| 1:30-1:50 | Screen recording: Admin login (admin@krmu.edu.in/Admin@123) and dashboard overview |
| 1:50-2:10 | Screen recording: Admin managing vendors and menus |
| 2:10-2:25 | Screen recording: Vendor login (ramesh.sharma@krmu.edu.in/Vendor@123) and dashboard |
| 2:25-2:50 | Screen recording: Customer accessing via QR code and browsing (student@krmu.edu.in/Student@123) |
| 2:50-3:10 | Screen recording: Customer multi-vendor cart and checkout |
| 3:10-3:25 | Screen recording: Vendor receiving and completing order |
| 3:25-3:40 | Screen recording: Customer receiving order ready notification |
| 3:40-4:00 | Talking head: Parth summarizing impact, team contributions, test credentials, and future plans |

**(End of file)**