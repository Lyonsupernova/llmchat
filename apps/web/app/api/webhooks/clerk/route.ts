// /pages/api/webhooks/clerk.ts

import { prisma } from '@repo/prisma';
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  if (request.method !== "POST")
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  
  const data = await request.json();
  console.log("Log: Received webhook data -", data);
  
  if (data.type === "user.created") {
    const { id, email_addresses, first_name, last_name } = data.data;
    console.log("inputs:", id, email_addresses, first_name, last_name);
    
    const email_address = email_addresses[0]?.email_address;
    if (!email_address) {
      return NextResponse.json(
        { error: "Error Email address is required" },
        { status: 400 }
      );
    }

    try {
      // Use upsert to handle potential race conditions
      await prisma.tEST_User.upsert({
        where: { id: id },
        update: {
          email: email_address,
          name: `${first_name || ''} ${last_name || ''}`.trim() || null,
        },
        create: {
          id: id,
          email: email_address,
          name: `${first_name || ''} ${last_name || ''}`.trim() || null,
          role: 'USER',
        },
      });
      
      console.log(`User ${id} created/updated successfully via webhook`);
    } catch (error) {
      console.error('Error creating/updating user:', error);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }
  }

  if (data.type === "user.updated") {
    const { id, email_addresses, first_name, last_name } = data.data;
    console.log("Updating user:", id, email_addresses, first_name, last_name);
    
    const email_address = email_addresses[0]?.email_address;
    
    try {
      // Update user in TEST_User table
      await prisma.tEST_User.upsert({
        where: { id: id },
        update: {
          email: email_address,
          name: `${first_name || ''} ${last_name || ''}`.trim() || null,
        },
        create: {
          id: id,
          email: email_address,
          name: `${first_name || ''} ${last_name || ''}`.trim() || null,
          role: 'USER',
        },
      });
      
      console.log(`User ${id} updated successfully via webhook`);
    } catch (error) {
      console.error('Error updating user:', error);
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 }
      );
    }
  }

  if (data.type === "user.deleted") {
    const { id } = data.data;
    console.log("Deleting user:", id);
    
    try {
      // Delete user from TEST_User table
      await prisma.tEST_User.delete({
        where: { id: id },
      });
      
      console.log(`User ${id} deleted successfully via webhook`);
    } catch (error) {
      console.error('Error deleting user:', error);
      // Don't return error if user doesn't exist
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        console.log(`User ${id} already deleted or doesn't exist`);
      } else {
        return NextResponse.json(
          { error: "Failed to delete user" },
          { status: 500 }
        );
      }
    }
  }

  return NextResponse.json({ received: true, data }, { status: 200 });
}