const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Create appointment
router.post('/', async (req, res) => {
  try {
    const { purpose, whomToSee, companions, organisation, devices, visitorEmail, visitorName, visitorPhone, visitorPin } = req.body;

    // Validate required fields
    if (!purpose || !whomToSee) {
      return res.status(400).json({ 
        success: false, 
        message: 'Purpose and whom to see are required fields' 
      });
    }

    if (!visitorEmail && !visitorName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Visitor email or name is required' 
      });
    }

    // Find or create visitor
    let visitor = null;
    
    if (visitorEmail) {
      // Try to find visitor by email
      const { data: existingVisitor } = await supabase
        .from('visitors')
        .select('*')
        .eq('email', visitorEmail)
        .single();

      if (existingVisitor) {
        visitor = existingVisitor;
        
        // Update visitor info if provided
        if (visitorName || organisation || visitorPhone || visitorPin) {
          const updateData = {};
          if (visitorName) updateData.name = visitorName;
          if (organisation) updateData.organisation = organisation;
          if (visitorPhone) updateData.phone = visitorPhone;
          if (visitorPin) updateData.pin = visitorPin;
          updateData.updated_at = new Date();

          const { data: updatedVisitor } = await supabase
            .from('visitors')
            .update(updateData)
            .eq('id', visitor.id)
            .select()
            .single();

          if (updatedVisitor) visitor = updatedVisitor;
        }
      } else {
        // Create new visitor
        const { data: newVisitor, error: visitorError } = await supabase
          .from('visitors')
          .insert([{
            name: visitorName || 'Unknown',
            email: visitorEmail,
            phone: visitorPhone || null,
            pin: visitorPin || null,
            organisation: organisation || null
          }])
          .select()
          .single();

        if (visitorError) {
          console.error('Error creating visitor:', visitorError);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to create visitor record' 
          });
        }

        visitor = newVisitor;
      }
    } else {
      // If no email, try to find by name and organisation
      const { data: existingVisitor } = await supabase
        .from('visitors')
        .select('*')
        .eq('name', visitorName)
        .eq('organisation', organisation || '')
        .single();

      if (existingVisitor) {
        visitor = existingVisitor;
      } else {
        // Create new visitor without email
        const { data: newVisitor, error: visitorError } = await supabase
          .from('visitors')
          .insert([{
            name: visitorName,
            phone: visitorPhone || null,
            pin: visitorPin || null,
            organisation: organisation || null
          }])
          .select()
          .single();

        if (visitorError) {
          console.error('Error creating visitor:', visitorError);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to create visitor record' 
          });
        }

        visitor = newVisitor;
      }
    }

    if (!visitor) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to process visitor information' 
      });
    }

    // Create appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert([{
        visitor_id: visitor.id,
        purpose: Array.isArray(purpose) ? purpose.join(', ') : purpose,
        whom_to_see: whomToSee,
        companions: companions && companions !== 'none' ? companions : null,
        devices: devices || null,
        organisation: organisation || null,
        status: 'pending'
      }])
      .select(`
        *,
        visitors (
          id,
          name,
          email,
          phone,
          pin,
          organisation
        )
      `)
      .single();

    if (appointmentError) {
      console.error('Error creating appointment:', appointmentError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create appointment' 
      });
    }

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: appointment,
      appointmentId: appointment.id
    });

  } catch (error) {
    console.error('Appointment creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Get appointments
router.get('/', async (req, res) => {
  try {
    const { purpose, whomToSee, organisation, visitorId, status } = req.query;
    
    let query = supabase
      .from('appointments')
      .select(`
        *,
        visitors (
          id,
          name,
          email,
          phone,
          pin,
          organisation
        )
      `);
    
    if (purpose) {
      query = query.ilike('purpose', `%${purpose}%`);
    }
    
    if (whomToSee) {
      query = query.eq('whom_to_see', whomToSee);
    }

    if (organisation) {
      query = query.eq('organisation', organisation);
    }

    if (visitorId) {
      query = query.eq('visitor_id', visitorId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching appointments:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch appointments' 
      });
    }

    res.status(200).json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Get single appointment
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        visitors (
          id,
          name,
          email,
          phone,
          pin,
          organisation
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching appointment:', error);
      return res.status(404).json({ 
        success: false, 
        message: 'Appointment not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Update appointment status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Status must be one of: ${validStatuses.join(', ')}` 
      });
    }

    const { data, error } = await supabase
      .from('appointments')
      .update({ 
        status,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating appointment:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update appointment' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Appointment status updated successfully',
      data: data
    });

  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;