import { useState } from 'react';
import { useParams, Link, Outlet, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';

import Header from '../Header.jsx';
import { fetchEvent, deleteEvent, queryClient } from '../../util/http.js';
import ErrorBlock from '../UI/ErrorBlock.jsx';
import Modal from '../UI/Modal';

export default function EventDetails() {
  const [isDeleting, setIsDeleting] = useState(false);

  const params = useParams(); // Get an event ID from URL
  const navigate = useNavigate(); // For navigation after delete

  // Fetch event details
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['events', params.id],
    queryFn: ({ signal }) => fetchEvent({ signal, id: params.id }) // Fetch event using the event ID
  });

  // Mutation to delete the event
  const {
    mutate,
    isPending: isPendingDeletion,
    isError: isErrorDeleting,
    error: deleteError
  } = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      // Navigate back to events list and invalidate events query
      queryClient.invalidateQueries({
        // Refetch events
        queryKey: ['events'],
        refetchType: 'none'
      });
      navigate('/events');
    },
    onError: err => {
      console.log('Delete failed', err);
    }
  });

  function handleStartDelete() {
    setIsDeleting(true);
  }

  function handleStopDelete() {
    setIsDeleting(false);
  }

  const handleDelete = () => {
    mutate({ id: params.id }); // Call mutation to delete the event
  };

  let content;

  if (isPending) {
    content = (
      <div id="event-details-content" className="center">
        <p>Fetching event data</p>
      </div>
    );
  }

  if (isError) {
    content = (
      <div id="event-details-content" className="center">
        <ErrorBlock
          title="Failed to load event"
          message={
            error.info?.message ||
            'Failed to fetch event data, please try again later'
          }
        />
      </div>
    );
  }

  if (data) {
    const formattedDate = new Date(data.date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    content = (
      <>
        <header>
          <h1>{data.title}</h1>
          <nav>
            <button onClick={handleStartDelete}>Delete</button>
            <Link to="edit">Edit</Link>
          </nav>
        </header>

        <div id="event-details-content">
          <img src={`http://localhost:3000/${data.image}`} alt={data.title} />
          <div id="event-details-info">
            <div>
              <p id="event-details-location">{data.location}</p>
              <time dateTime={`${data.date}T${data.time}`}>
                {formattedDate} @ {data.time}
              </time>
            </div>
            <p id="event-details-description">{data.description}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {isDeleting && (
        <Modal onClose={handleStopDelete}>
          <h2>Are you sure?</h2>
          <p>
            Do you really want to delete this event? This action cannot be
            undone.
          </p>
          <div className="form-actions">
            {isPendingDeletion && <p>Deleting, Please wait...</p>}
            {!isPendingDeletion && (
              <>
                <button onClick={handleStopDelete} className="button-text">
                  Cancel
                </button>
                <button onClick={handleDelete} className="button">
                  Delete
                </button>
              </>
            )}
          </div>
          {isErrorDeleting && <ErrorBlock title="Failed to delete event" message={deleteError?.message || 'Failed to delete event, please trye again later.'}/>}
        </Modal>
      )}
      <Outlet />
      <Header>
        <Link to="/events" className="nav-item">
          View all Events
        </Link>
      </Header>
      <article id="event-details">{content}</article>
    </>
  );
}

/*
Explanation of Key Parts:
useParams() Hook:

This hook grabs the id from the URL (e.g., /events/1), allowing us to fetch the correct event details 
for the page. useQuery for Fetching 

Event Data:
We use useQuery to fetch event data. The key 'event' and the ID (id) are passed as the query key, ensuring that 
the data is cached separately for each event. If the event is loading, we show a loading message. Once the 
event is fetched, we display it on the page. useMutation for Deleting the Event:

useMutation is used for the delete operation. The mutation function (deleteEvent) is triggered when the "Delete" 
button is clicked. The mutation has an onSuccess callback, where we use navigate to redirect the user to the 
events list page (/events). We also call queryClient.invalidateQueries(['events']) to ensure that the events 
list is refreshed after the deletion.

Error Handling:
If there's an error fetching the eve
nt, or an error occurs during deletion, we display an ErrorBlock with 
the appropriate error message.

Keeping Outlet:
The Outlet is kept in place for possible future nested routes (e.g., for an edit form), which will be 
rendered in this spot when the user navigates to a nested route like /events/:id/edit.

Flow of Execution:
When the user clicks the "View Details" button on the EventItem component, they are navigated to /events/${id} 
where the EventDetails component is rendered. The event details are fetched and displayed using useQuery.
If the user clicks the "Delete" button, the event is deleted via the deleteMutation hook, and the user 
is redirected back to the events list page. If there are any errors during fetching or deletion, 
an error message is shown.

Conclusion:
This implementation of the delete feature uses React Query for data fetching and mutation. The Outlet is 
preserved, so you can add nested routes (like the Edit route) later without losing functionality. 
The useMutation hook handles the event deletion, and the page redirects appropriately when the deletion is successful.
*/
