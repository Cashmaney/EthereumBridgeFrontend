import React, {useEffect, useState} from 'react';
import MaintenanceModal from '../MaintenanceModal/index';
import { useStores } from 'stores';
import { observer } from 'mobx-react'; 

export default observer(() => {
  
  const { user } = useStores();

  const [modalOpen, setModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (process.env.IS_MAINTENANCE === 'true') {

      setModalOpen(true);
      
    } else {
      return;
    }
  }, [])

  return (

      <>  
        <MaintenanceModal
            title="We made adjustments to Secret Swap and some functionality is not available at the moment."
            subtitle="Sorry for the inconvenience, we are working to bring it back as soon as possible."
            open={modalOpen}
            setOpen={() => setModalOpen(false)}
        />
      </>

  )

});
