import React, { useEffect, useState } from 'react';
import { Scatter } from 'react-chartjs-2';
import 'chart.js/auto';
import './App.css';

const EmbeddingsVisualizer = () => {
  const [umapData, setUmapData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the embeddings data from the Flask backend
    const fetchData = async () => {
      try {
        const response = await fetch('http://oh-cxg-dev.mvls.gla.ac.uk/get_embeddings');
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Fetched embeddings data:', data); // Debugging log

        if (data.error) {
          console.error('Error fetching data:', data.error);
        } else {
          setUmapData(data.umap_embeddings);
        }
      } catch (error) {
        console.error('Error fetching embeddings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Prepare the UMAP data for the scatter plot
  const prepareScatterData = (embeddings, label) => {
    if (!embeddings) return null;
    const scatterData = embeddings.map((point) => ({ x: point[0], y: point[1] }));
    console.log('Prepared scatter data:', scatterData); // Debugging log

    return {
      labels: Array(embeddings.length).fill(label),
      datasets: [
        {
          label: label,
          data: scatterData,
          backgroundColor: 'rgba(75,192,192,0.6)',
          borderColor: 'rgba(75,192,192,1)',
          pointRadius: 3,
        },
      ],
    };
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!umapData) {
    return <div>No embeddings data available.</div>;
  }

  const scatterData = prepareScatterData(umapData, 'UMAP');
  if (!scatterData) {
    return <div>Failed to prepare data for visualization.</div>;
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>UMAP Embeddings</h2>
      <div style={{ width: '80%', margin: '0 auto', marginBottom: '40px' }}>
        <Scatter data={scatterData} options={{ responsive: true }} />
      </div>
    </div>
  );
};

export default EmbeddingsVisualizer;
